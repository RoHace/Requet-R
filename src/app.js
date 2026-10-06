"use strict";
/* ═══════════════════════════════════════════════════════════
   REQUÊT'R — lot 1 : build + sql.js embarqué
   1. CONFIG     2. UI (el, icônes, toasts)     3. MOTEUR SQL
   4. DÉMO (page jetable, remplacée au lot 3)   5. APP
   Globaux fournis par le build : initSqlJs (vendor), WASM_B64, SEED_SQL, CONTENU.
   ═══════════════════════════════════════════════════════════ */

/* ══ 1. CONFIG ══════════════════════════════════════════════ */
const CONFIG = {
  version: "0.1.0-lot1",
  schema: 1,
  cle: "requeter.etat"          // clé de stockage, utilisée à partir du lot 4 (Store)
};

/* ══ 2. UI (repris de Classe'R) ═════════════════════════════ */
/** Fabrique d'éléments : el("div.carte", {onclick}, "texte", elEnfant) */
function el(selecteur, attrs = {}, ...enfants) {
  const [tag, ...classes] = selecteur.split(".");
  const n = document.createElement(tag || "div");
  if (classes.length) n.className = classes.join(" ");
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "html") n.innerHTML = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (k === "class") n.className += " " + v;
    else n.setAttribute(k, v);
  }
  enfants.flat().forEach(c => {
    if (c === null || c === undefined || c === false) return;
    n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  });
  return n;
}

const ICONES = {
  bacasable: '<rect x="3" y="4" width="14" height="12" rx="1.5"/><path d="M6.5 8.5 9 10.5l-2.5 2M11 13h3"/>'
};
function icone(nom) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 20 20"); s.setAttribute("fill", "none");
  s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "1.6");
  s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round");
  s.innerHTML = ICONES[nom] || "";
  return s;
}

const Toast = {
  afficher(message, type = "") {
    const t = el("div.toast" + (type === "accent" ? ".toast--accent" : ""), {}, message);
    document.getElementById("toasts").append(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity 200ms"; }, 2600);
    setTimeout(() => t.remove(), 2900);
  }
};

/* ══ 3. MOTEUR SQL ══════════════════════════════════════════ */
/** SQLite (sql.js) tournant en mémoire. Le binaire WASM est décodé depuis WASM_B64 :
 *  on passe wasmBinary et JAMAIS l'option de localisation du fichier, qui déclencherait une requête réseau. */
const Moteur = (() => {
  let SQL = null, db = null;
  const etat = { version: null, msInit: null };
  const LIMITE_LIGNES = 500;     // au-delà, l'affichage est tronqué (le moteur, lui, a tout lu)

  function decoderBase64(b64) {
    const binaire = atob(b64);
    const octets = new Uint8Array(binaire.length);
    for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
    return octets;
  }

  /** Repart d'une base propre : seed rejoué, rien d'autre. */
  function reinitialiser() {
    if (db) db.close();
    db = new SQL.Database();
    if (SEED_SQL.trim()) db.exec(SEED_SQL);
  }

  async function initialiser() {
    const debut = performance.now();
    SQL = await initSqlJs({ wasmBinary: decoderBase64(WASM_B64).buffer });
    reinitialiser();
    etat.version = db.exec("SELECT sqlite_version()")[0].values[0][0];
    etat.msInit = Math.round(performance.now() - debut);
    return etat;
  }

  /** Exécute un script (une ou plusieurs instructions) sur la base courante.
   *  Renvoie les jeux de résultats produits avant une éventuelle erreur ; l'erreur est le message SQLite brut.
   *  Un SELECT sans ligne donne quand même ses colonnes (db.exec, lui, l'omettrait). */
  function executer(sql) {
    const debut = performance.now();
    const jeux = [];
    let erreur = null;
    try {
      for (const st of db.iterateStatements(sql)) {
        const colonnes = st.getColumnNames();
        if (colonnes.length) {
          const lignes = [];
          while (st.step()) lignes.push(st.get());
          jeux.push({ colonnes, lignes });
        } else {
          st.step();               // CREATE, INSERT… : il faut l'exécuter, pas seulement le préparer
        }
        st.free();
      }
    } catch (err) {
      erreur = err.message;
    }
    return { jeux, erreur, ms: Math.round((performance.now() - debut) * 10) / 10, limite: LIMITE_LIGNES };
  }

  function nbTables() {
    return db.exec("SELECT count(*) FROM sqlite_master WHERE type = 'table'")[0].values[0][0];
  }

  return { initialiser, reinitialiser, executer, nbTables, etat };
})();

/* ══ 4. DÉMO (jetable : remplacée au lot 3) ═════════════════ */
const EXEMPLES = {
  test: "SELECT 1 AS test;",
  creer:
`DROP TABLE IF EXISTS clients;
CREATE TABLE clients (
  id INTEGER PRIMARY KEY,
  nom TEXT NOT NULL,
  ville TEXT,
  solde REAL
);
INSERT INTO clients (nom, ville, solde) VALUES
  ('Camille', 'Lille', 120.5),
  ('Nolan', NULL, 0),
  ('Inès', 'Lyon', 87.25);`,
  interroger:
`SELECT nom, ville, solde
FROM clients
ORDER BY nom;`
};

function formaterCellule(v) {
  if (v === null) return { texte: "NULL", classe: "nul" };
  if (v instanceof Uint8Array) return { texte: `BLOB (${v.length} o)`, classe: "nul" };
  if (typeof v === "number") return { texte: String(v), classe: "nombre" };
  return { texte: String(v), classe: "" };
}

function tableResultat(jeu, limite) {
  const affichees = jeu.lignes.slice(0, limite);
  const corps = affichees.length
    ? affichees.map(l => el("tr", {}, l.map(v => { const f = formaterCellule(v); return el("td" + (f.classe ? "." + f.classe : ""), {}, f.texte); })))
    : [el("tr", {}, el("td.aucune", { colspan: jeu.colonnes.length }, "Aucune ligne."))];
  return el("div.resultat__zone", {},
    el("table", {},
      el("thead", {}, el("tr", {}, jeu.colonnes.map(c => el("th", { scope: "col" }, c)))),
      el("tbody", {}, corps)));
}

function pageDemo() {
  const editeur = el("textarea.editeur-sql", {
    id: "sql", spellcheck: "false", autocomplete: "off", autocapitalize: "off", "aria-label": "Requête SQL"
  }, EXEMPLES.test);
  const sortie = el("div.resultat", { "aria-live": "polite" });
  const etat = el("div.sql-etat", {});
  const puceTables = el("span.puce", {});

  function majEtat(extra) {
    puceTables.textContent = `${Moteur.nbTables()} table(s) en mémoire`;
    etat.replaceChildren(
      el("span", {}, `SQLite ${Moteur.etat.version}`),
      el("span", {}, `prêt en ${Moteur.etat.msInit} ms`),
      puceTables,
      extra ? el("span", {}, extra) : null
    );
  }

  function lancer() {
    const res = Moteur.executer(editeur.value);
    const blocs = [];
    res.jeux.forEach((jeu, i) => {
      const n = jeu.lignes.length;
      blocs.push(el("h3.resultat__titre", {},
        (res.jeux.length > 1 ? `Résultat ${i + 1} — ` : "") + `${n} ligne${n > 1 ? "s" : ""}`));
      blocs.push(tableResultat(jeu, res.limite));
      if (n > res.limite) blocs.push(el("p.resultat__note", {}, `Affichage limité aux ${res.limite} premières lignes.`));
    });
    if (res.erreur) {
      blocs.push(el("div.erreur-sql", { role: "alert" }, el("b", {}, "Erreur SQLite"), el("pre", {}, res.erreur)));
    } else if (!res.jeux.length) {
      blocs.push(el("p.muet", { style: "margin-top:12px" }, "Exécuté sans erreur. Cette requête ne renvoie aucune ligne."));
    }
    sortie.replaceChildren(...blocs);
    majEtat(`${res.ms} ms`);
  }

  function exemple(cle) { editeur.value = EXEMPLES[cle]; lancer(); editeur.focus(); }

  editeur.addEventListener("keydown", ev => {
    if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); lancer(); }
  });

  const bascule = el("button.btn.btn--nu", { type: "button", onclick: () => basculerTheme() }, "Thème clair / sombre");

  const page = el("div.vue", {},
    el("header.entete", {},
      el("div.entete__sur", {}, "Lot 1 — page de démonstration"),
      el("h1", {}, "Bac à sable SQL"),
      el("p", {}, "Un vrai SQLite, dans ce seul fichier, sans réseau. La base vit en mémoire tant que la page reste ouverte.")),
    el("section.carte", {},
      editeur,
      el("div.sql-barre", {},
        el("button.btn.btn--fort", { type: "button", onclick: lancer }, "Exécuter"),
        el("span.tres-muet", { style: "font-size:12.5px" }, "Ctrl + Entrée"),
        el("span.sql-barre__espace"),
        el("button.btn", { type: "button", onclick: () => {
          Moteur.reinitialiser(); sortie.replaceChildren(); majEtat();
          Toast.afficher("Base réinitialisée.", "accent");
        } }, "Réinitialiser la base")),
      el("div.sql-exemples", {},
        el("span.tres-muet", { style: "font-size:12.5px" }, "Exemples :"),
        el("button.btn", { type: "button", onclick: () => exemple("test") }, "SELECT 1"),
        el("button.btn", { type: "button", onclick: () => exemple("creer") }, "Créer la table clients"),
        el("button.btn", { type: "button", onclick: () => exemple("interroger") }, "Interroger clients"),
        el("span.sql-barre__espace"),
        bascule),
      etat),
    sortie
  );
  majEtat();
  lancer();                         // auto-contrôle : SELECT 1 AS test s'affiche dès l'ouverture
  return page;
}

/* ══ 5. APP ═════════════════════════════════════════════════ */
function appliquerTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", getComputedStyle(document.documentElement).getPropertyValue("--fond").trim());
}
function basculerTheme() {
  appliquerTheme(document.documentElement.dataset.theme === "sombre" ? "clair" : "sombre");
}

function coquille(contenu) {
  document.getElementById("app").replaceChildren(
    el("a.saut", { href: "#", onclick: ev => { ev.preventDefault(); document.getElementById("zone-contenu").focus(); } },
      "Aller au contenu"),
    el("aside.rail", {},
      el("div.rail__marque", {}, el("div.logo", {}, "R"), el("div.rail__nom", {}, "Requêt'R")),
      el("nav.rail__nav", { "aria-label": "Navigation principale" },
        el("a.rail__lien", { href: "#/bac-a-sable", "aria-current": "page" }, icone("bacasable"), el("span", {}, "Bac à sable"))),
      el("div.rail__bas", {}, el("div.tres-muet", { style: "font-size:11.5px" }, "Apprendre le SQL en pratiquant"))),
    el("main.principal", {}, el("div.contenu", { id: "zone-contenu", tabindex: "-1" }, contenu))
  );
}

async function demarrer() {
  appliquerTheme("clair");
  coquille(el("p.muet", {}, "Chargement de SQLite…"));
  try {
    await Moteur.initialiser();
    coquille(pageDemo());
  } catch (err) {
    console.error(err);
    coquille(el("div.erreur-sql", { role: "alert" }, el("b", {}, "SQLite n'a pas pu démarrer"), el("pre", {}, String(err && err.message || err))));
  }
}

document.addEventListener("DOMContentLoaded", demarrer);
