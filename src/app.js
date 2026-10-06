"use strict";
/* ═══════════════════════════════════════════════════════════
   REQUÊT'R — lot 2 : base de démonstration + explorateur de schéma
   1. CONFIG     2. UI (el, icônes, toasts, tableau, piège de focus)     3. MOTEUR SQL
   4. EXPLORATEUR DE SCHÉMA     5. DÉMO (page jetable, remplacée au lot 3)     6. APP
   Globaux fournis par le build : initSqlJs (vendor), WASM_B64, SEED_SQL, CONTENU.
   ═══════════════════════════════════════════════════════════ */

/* ══ 1. CONFIG ══════════════════════════════════════════════ */
const CONFIG = {
  version: "0.2.0-lot2",
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
  bacasable: '<rect x="3" y="4" width="14" height="12" rx="1.5"/><path d="M6.5 8.5 9 10.5l-2.5 2M11 13h3"/>',
  schema: '<rect x="2.5" y="3" width="6" height="5" rx="1"/><rect x="11.5" y="3" width="6" height="5" rx="1"/><rect x="7" y="12.5" width="6" height="5" rx="1"/><path d="M5.5 8v2.5h4.5v2M14.5 8v2.5H10"/>'
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

/** Modale accessible : le focus reste dans la boîte, Échap ferme si c'est permis, et le focus revient
 *  à l'élément qui l'avait ouverte — quelle que soit la façon dont elle se referme.
 *  Portée telle quelle de Classe'R (prévue au lot 4, nécessaire dès l'explorateur). */
function piegeFocus(voile, { fermer = null } = {}) {
  const declencheur = document.activeElement;
  const focalisables = () => [...voile.querySelectorAll("button:not([disabled]), input:not([disabled]), select, textarea, a[href], [tabindex]:not([tabindex='-1'])")]
    .filter(e => e.offsetParent !== null || e === document.activeElement);
  voile.addEventListener("keydown", ev => {
    if (ev.key === "Escape" && fermer) { ev.preventDefault(); ev.stopPropagation(); fermer(); return; }
    if (ev.key !== "Tab") return;
    const l = focalisables(); if (!l.length) return;
    const premier = l[0], dernier = l[l.length - 1];
    if (!voile.contains(document.activeElement)) { ev.preventDefault(); premier.focus(); }
    else if (ev.shiftKey && document.activeElement === premier) { ev.preventDefault(); dernier.focus(); }
    else if (!ev.shiftKey && document.activeElement === dernier) { ev.preventDefault(); premier.focus(); }
  });
  const retirer = voile.remove.bind(voile);
  voile.remove = () => { retirer(); if (declencheur && declencheur.isConnected && declencheur !== document.body) declencheur.focus(); };
}

/** Valeur de cellule : NULL se voit (italique grisé), les nombres s'alignent à droite. */
function formaterCellule(v) {
  if (v === null) return { texte: "NULL", classe: "nul" };
  if (v instanceof Uint8Array) return { texte: `BLOB (${v.length} o)`, classe: "nul" };
  if (typeof v === "number") return { texte: String(v), classe: "nombre" };
  return { texte: String(v), classe: "" };
}

/** Table de résultats en lecture seule (à placer dans un conteneur .resultat). */
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

/* ══ 3. MOTEUR SQL ══════════════════════════════════════════ */
/** SQLite (sql.js) tournant en mémoire. Le binaire WASM est décodé depuis WASM_B64 :
 *  on passe wasmBinary et JAMAIS l'option de localisation du fichier, qui déclencherait une requête réseau. */
const Moteur = (() => {
  let SQL = null, db = null;
  const etat = { version: null, msInit: null, msBase: null };
  const LIMITE_LIGNES = 500;     // au-delà, l'affichage est tronqué (le moteur, lui, a tout lu)

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

  return { initialiser, reinitialiser, executer, nbTables, schema, etat };
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

/* ══ 4. EXPLORATEUR DE SCHÉMA ═══════════════════════════════ */
/** Carte des relations : une boîte par table, un trait par clé étrangère (« 1 » côté table pointée, « N » côté table
 *  qui pointe). Mise en page déduite des clés lues : une table se place à droite de celles vers lesquelles elle pointe.
 *  Purement visuelle (aria-hidden) : la liste textuelle des relations et les onglets sont l'équivalent accessible. */
function carteRelations(tables, choisir) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = (tag, attrs = {}, ...enfants) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    enfants.forEach(c => n.append(c));
    return n;
  };
  const texte = (attrs, contenu) => { const n = svg("text", attrs); n.textContent = contenu; return n; };
  const noms = new Set(tables.map(t => t.nom));
  const parents = t => [...new Set(t.cles.map(c => c.table).filter(p => p !== t.nom && noms.has(p)))];

  // colonne de la carte = profondeur dans le graphe des clés (plafonnée, pour qu'un cycle ne boucle pas)
  const col = Object.fromEntries(tables.map(t => [t.nom, 0]));
  for (let i = 0; i < tables.length; i++) {
    for (const t of tables) for (const p of parents(t)) col[t.nom] = Math.min(Math.max(col[t.nom], col[p] + 1), tables.length - 1);
  }
  // rang vertical : en première colonne l'ordre de création, ensuite la moyenne des rangs des tables parentes
  const rang = {};
  const colonnes = [];
  tables.forEach(t => (colonnes[col[t.nom]] = colonnes[col[t.nom]] || []).push(t));
  colonnes.forEach((groupe, c) => {
    if (!groupe) return;
    groupe.forEach((t, i) => {
      const ps = parents(t).filter(p => rang[p] !== undefined);
      rang[t.nom] = c && ps.length ? ps.reduce((s, p) => s + rang[p], 0) / ps.length : i;
    });
    groupe.sort((a, b) => rang[a.nom] - rang[b.nom]);
    groupe.forEach((t, i) => { if (i && rang[t.nom] < rang[groupe[i - 1].nom] + 1) rang[t.nom] = rang[groupe[i - 1].nom] + 1; });
  });

  const L = 150, H = 40, ECART = 70, PAS = 62, MARGE = 14;
  const autoRef = tables.some(t => t.cles.some(c => c.table === t.nom));
  const gauche = autoRef ? 120 : MARGE;
  const largeur = gauche + colonnes.length * L + (colonnes.length - 1) * ECART + MARGE;
  const hauteur = MARGE * 2 + Math.max(...Object.values(rang)) * PAS + H;
  const x = t => gauche + col[t.nom] * (L + ECART);
  const y = t => MARGE + rang[t.nom] * PAS;

  // les traits arrivant sur (ou partant de) une même boîte se répartissent le long de son bord
  const traits = tables.flatMap(t => t.cles.map(c => ({ fils: t, parent: tables.find(o => o.nom === c.table), colonne: c.de }))).filter(e => e.parent);
  traits.sort((a, b) => rang[a.parent.nom] - rang[b.parent.nom] || rang[a.fils.nom] - rang[b.fils.nom]);   // pas de croisement à l'arrivée
  const total = { sortie: {}, entree: {} }, vus = { sortie: {}, entree: {} };
  traits.filter(e => e.parent !== e.fils).forEach(e => {
    total.sortie[e.parent.nom] = (total.sortie[e.parent.nom] || 0) + 1;
    total.entree[e.fils.nom] = (total.entree[e.fils.nom] || 0) + 1;
  });
  const position = (sens, t) => { vus[sens][t.nom] = (vus[sens][t.nom] || 0) + 1; return H * vus[sens][t.nom] / (total[sens][t.nom] + 1); };

  const dessin = [];
  traits.forEach(({ fils, parent, colonne }) => {
    if (fils === parent) {                          // auto-référence : boucle à gauche, nommée par sa colonne
      const x0 = x(fils), y0 = y(fils);
      dessin.push(svg("path", { class: "sv-lien", d: `M ${x0} ${y0 + 9} C ${x0 - 50} ${y0 + 2} ${x0 - 50} ${y0 + H - 2} ${x0} ${y0 + H - 9}` }));
      dessin.push(texte({ class: "sv-colonne", x: x0 - 44, y: y0 + H / 2 + 4, "text-anchor": "end" }, colonne));
      return;
    }
    const x1 = x(parent) + L, y1 = y(parent) + position("sortie", parent), x2 = x(fils), y2 = y(fils) + position("entree", fils), xm = (x1 + x2) / 2;
    dessin.push(svg("path", { class: "sv-lien", d: `M ${x1} ${y1} C ${xm} ${y1} ${xm} ${y2} ${x2} ${y2}` }));
    dessin.push(texte({ class: "sv-card", x: x1 + 6, y: y1 - 5 }, "1"));
    dessin.push(texte({ class: "sv-card", x: x2 - 6, y: y2 - 5, "text-anchor": "end" }, "N"));
  });
  tables.forEach(t => {
    const g = svg("g", { class: "sv-boite", "data-table": t.nom, "data-actif": "0", transform: `translate(${x(t)} ${y(t)})` },
      svg("rect", { width: L, height: H, rx: 8 }),
      texte({ class: "sv-nom", x: L / 2, y: 17, "text-anchor": "middle" }, t.nom),
      texte({ class: "sv-nb", x: L / 2, y: 32, "text-anchor": "middle" }, `${t.lignes} ligne${t.lignes > 1 ? "s" : ""}`));
    g.addEventListener("click", () => choisir(t.nom));
    dessin.push(g);
  });

  const racine = svg("svg", { class: "sv", viewBox: `0 0 ${largeur} ${hauteur}`, width: largeur, height: hauteur, "aria-hidden": "true", focusable: "false" }, ...dessin);
  const conteneur = el("div.schema-carte", {}, racine);
  conteneur.majActif = nom => racine.querySelectorAll(".sv-boite").forEach(g => { g.dataset.actif = g.dataset.table === nom ? "1" : "0"; });
  return conteneur;
}

/** Panneau consultable par-dessus l'écran en cours, sans jamais l'interrompre : même mécanique que le Lexique de Classe'R
 *  (voile, rôle dialog, Échap, piège de focus, retour du focus au bouton du rail).
 *  Il lit la base VIVANTE : ce que l'apprenant vient de faire (DELETE, DROP…) s'y voit. */
const Explorateur = (() => {
  let voile = null, btn = null;
  const cible = (table, colonne) => colonne ? `${table}.${colonne}` : table;

  function detailTable(t, tables, choisir) {
    const doc = (CONTENU.base && CONTENU.base.tables && CONTENU.base.tables[t.nom]) || {};
    const cle = t.colonnes.filter(c => c.pk).sort((a, b) => a.pk - b.pk).map(c => c.nom);
    const fk = Object.fromEntries(t.cles.map(c => [c.de, c]));
    const refs = tables.flatMap(o => o.cles.filter(c => c.table === t.nom).map(c => ({ table: o.nom, colonne: c.de })));
    const saut = (nom, libelle) => el("button.puce.puce--ambre.schema-saut", { type: "button", title: `Voir la table ${nom}`, onclick: () => choisir(nom) }, libelle);

    const code = el("pre.schema-sql", { hidden: true }, t.sql);
    const bascule = el("button.btn.btn--nu", { type: "button", "aria-expanded": "false", onclick: () => {
      const ouvrir = code.hidden;
      code.hidden = !ouvrir;
      bascule.setAttribute("aria-expanded", String(ouvrir));
      bascule.textContent = ouvrir ? "Masquer l'instruction CREATE TABLE" : "Voir l'instruction CREATE TABLE";
    } }, "Voir l'instruction CREATE TABLE");

    return el("div.schema-detail", {},
      el("div.schema-detail__tete", {},
        el("h3.mono", {}, t.nom),
        el("span.puce", {}, `${t.lignes} ligne${t.lignes > 1 ? "s" : ""}`)),
      doc.role ? el("p.muet", {}, doc.role) : null,
      el("p.schema-cle", {}, el("b", {}, "Clé primaire : "),
        cle.length ? el("span.mono", {}, cle.length > 1 ? `(${cle.join(", ")}) — clé composée` : cle[0]) : "aucune"),
      el("div.resultat", {}, el("div.resultat__zone", {}, el("table.schema-colonnes", {},
        el("thead", {}, el("tr", {}, ["Colonne", "Type", "Rôle", "Remarque"].map(h => el("th", { scope: "col" }, h)))),
        el("tbody", {}, t.colonnes.map(c => el("tr", {},
          el("td", {}, el("b", {}, c.nom)),
          el("td", {}, c.type || "—"),
          el("td", {}, el("div.schema-tags", {},
            c.pk ? el("span.puce.puce--accent", {}, "clé primaire") : null,
            fk[c.nom] ? saut(fk[c.nom].table, `clé étrangère → ${cible(fk[c.nom].table, fk[c.nom].vers)}`) : null,
            !c.obligatoire && !c.pk ? el("span.puce", {}, "peut être vide") : null)),
          el("td.schema-note", {}, (doc.colonnes && doc.colonnes[c.nom]) || ""))))))),
      el("p.schema-cle", {}, el("b", {}, "Référencée par : "),
        refs.length ? el("span.schema-tags", {}, refs.map(r => saut(r.table, cible(r.table, r.colonne)))) : "aucune autre table"),
      el("h4.schema-sous", {}, t.lignes > 5 ? "Les 5 premières lignes" : "Toutes les lignes"),
      el("div.resultat", {}, tableResultat({ colonnes: t.colonnes.map(c => c.nom), lignes: t.apercu }, 5)),
      el("div.schema-sql-bloc", {}, bascule, code));
  }

  function construire() {
    const tables = Moteur.schema();
    const corps = el("div.lexique__liste", {});

    if (!tables.length) {
      corps.append(el("p.muet", { style: "padding:14px 0" }, "La base ne contient aucune table pour le moment. « Réinitialiser la base » la reconstruit."));
    } else {
      const zone = el("div", {});
      const carte = carteRelations(tables, nom => choisir(nom));
      const onglets = el("div.segment.schema-onglets", { role: "group", "aria-label": "Tables de la base" },
        tables.map(t => el("button", { type: "button", "aria-pressed": "false", "data-table": t.nom, onclick: () => choisir(t.nom) }, t.nom)));
      const choisir = nom => {
        const t = tables.find(o => o.nom === nom);
        onglets.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.table === nom)));
        carte.majActif(nom);
        zone.replaceChildren(detailTable(t, tables, choisir));
        onglets.querySelector(`[data-table="${nom}"]`).focus();     // le bouton cliqué dans le détail disparaît : le focus reste dans le panneau
      };

      const relations = tables.flatMap(t => t.cles.map(c => ({ de: t.nom, colonne: c.de, vers: c.table, cible: c.vers })));
      corps.append(
        el("h3.schema-sous", {}, "Carte des relations"),
        el("p.muet.schema-lecture", {}, "Une clé étrangère est une colonne qui contient l'identifiant d'une ligne d'une autre table : c'est ainsi que les tables se relient. Sur la carte, « 1 » marque la table pointée (une seule ligne) et « N » la table qui pointe (plusieurs lignes possibles). Cliquez une table pour voir son détail."),
        carte,
        relations.length
          ? el("ul.schema-rel", {}, relations.map(r => el("li", {},
              el("span.mono", {}, `${r.de}.${r.colonne} → ${cible(r.vers, r.cible)}`),
              r.de === r.vers ? el("span.tres-muet", {}, " — la table se réfère à elle-même") : null)))
          : el("p.muet", {}, "Aucune clé étrangère : ces tables ne sont pas reliées entre elles."),
        el("h3.schema-sous", {}, "Les tables"),
        onglets, zone);
      choisir(tables[0].nom);
      // focus sur l'onglet actif, sans faire défiler : la carte (en haut) doit rester visible à l'ouverture
      setTimeout(() => { const actif = onglets.querySelector('[aria-pressed="true"]'); if (actif) actif.focus({ preventScroll: true }); }, 60);
    }

    const base = CONTENU.base || {};
    const boite = el("div.lexique.lexique--large", { role: "dialog", "aria-modal": "true", "aria-label": "Schéma de la base" },
      el("div.lexique__tete", {},
        el("h2", {}, "Schéma de la base"),
        el("span.tres-muet", { style: "font-size:13px" }, `${tables.length} table${tables.length > 1 ? "s" : ""}`),
        el("button.btn.btn--nu", { type: "button", onclick: () => API.fermer(), "aria-label": "Fermer le schéma" }, "✕")),
      corps,
      el("p.tres-muet.lexique__pied", {},
        base.dateReferenceTexte ? `Date de référence : ${base.dateReferenceTexte}. C'est « aujourd'hui » dans tous les exercices. ` : "",
        "Cette fenêtre montre la base telle qu'elle est maintenant."));
    voile = el("div.voile.voile--lexique", { onclick: ev => { if (ev.target === voile) API.fermer(); } }, boite);
    document.body.append(voile);
    piegeFocus(voile, { fermer: () => API.fermer() });
  }

  const API = {
    estOuvert: () => !!voile,
    ouvrir() { if (!voile) { construire(); API.majBouton(); } },
    fermer() { if (voile) { voile.remove(); voile = null; API.majBouton(); } },
    basculer() { API.estOuvert() ? API.fermer() : API.ouvrir(); },
    majBouton() { if (btn) btn.dataset.actif = API.estOuvert() ? "1" : "0"; },
    bouton() {
      btn = el("button.rail__lien.rail__lien--outil", { "data-actif": "0", type: "button",
        title: "Schéma de la base", onclick: () => API.basculer() },
        icone("schema"), el("span", {}, "Schéma"));
      return btn;
    }
  };
  return API;
})();

/* ══ 5. DÉMO (jetable : remplacée au lot 3) ═════════════════ */
const EXEMPLES = {
  test: "SELECT 1 AS test;",
  apercu:
`SELECT id, prenom, nom, ville
FROM clients
ORDER BY id
LIMIT 5;`,
  jointure:
`SELECT c.prenom, c.nom, o.id AS commande, o.date_commande, o.statut
FROM commandes AS o
JOIN clients AS c ON c.id = o.client_id
ORDER BY o.date_commande DESC, o.id DESC
LIMIT 5;`,
  agregat:
`SELECT statut, COUNT(*) AS nb
FROM commandes
GROUP BY statut
ORDER BY statut;`
};

function pageDemo() {
  const editeur = el("textarea.editeur-sql", {
    id: "sql", spellcheck: "false", autocomplete: "off", autocapitalize: "off", "aria-label": "Requête SQL"
  }, EXEMPLES.apercu);
  const sortie = el("div.resultat", { "aria-live": "polite" });
  const etat = el("div.sql-etat", {});
  const puceTables = el("span.puce", {});

  function majEtat(extra) {
    puceTables.textContent = `${Moteur.nbTables()} table(s) en mémoire`;
    etat.replaceChildren(
      el("span", {}, `SQLite ${Moteur.etat.version}`),
      el("span", {}, `prêt en ${Moteur.etat.msInit} ms`),
      el("span", {}, `base reconstruite en ${Moteur.etat.msBase} ms`),
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
      el("div.entete__sur", {}, "Lot 2 — page de démonstration"),
      el("h1", {}, "Bac à sable SQL"),
      el("p", {}, "Un vrai SQLite, dans ce seul fichier, sans réseau, avec la base d'une boutique en ligne. Ouvrez le « Schéma » (rail de navigation) pour voir ses tables et leurs relations, sans quitter cette page.")),
    el("section.carte", {},
      editeur,
      el("div.sql-barre", {},
        el("button.btn.btn--fort", { type: "button", onclick: lancer }, "Exécuter"),
        el("span.tres-muet", { style: "font-size:12.5px" }, "Ctrl + Entrée"),
        el("span.sql-barre__espace"),
        el("button.btn", { type: "button", onclick: () => {
          const ms = nouvelleBase(); sortie.replaceChildren(); majEtat();
          Toast.afficher(`Base reconstruite en ${ms} ms.`, "accent");
        } }, "Réinitialiser la base")),
      el("div.sql-exemples", {},
        el("span.tres-muet", { style: "font-size:12.5px" }, "Exemples :"),
        el("button.btn", { type: "button", onclick: () => exemple("test") }, "SELECT 1"),
        el("button.btn", { type: "button", onclick: () => exemple("apercu") }, "Aperçu des clients"),
        el("button.btn", { type: "button", onclick: () => exemple("jointure") }, "Une jointure"),
        el("button.btn", { type: "button", onclick: () => exemple("agregat") }, "Commandes par statut"),
        el("span.sql-barre__espace"),
        bascule),
      etat),
    sortie
  );
  majEtat();
  lancer();                         // la requête d'aperçu s'exécute dès l'ouverture
  return page;
}

/* ══ 6. APP ═════════════════════════════════════════════════ */
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
        el("a.rail__lien", { href: "#/bac-a-sable", "aria-current": "page" }, icone("bacasable"), el("span", {}, "Bac à sable")),
        el("div.rail__sep"),
        Explorateur.bouton()),
      el("div.rail__bas", {}, el("div.tres-muet", { style: "font-size:11.5px" }, "Apprendre le SQL en pratiquant"))),
    el("main.principal", {}, el("div.contenu", { id: "zone-contenu", tabindex: "-1" }, contenu))
  );
}

async function demarrer() {
  appliquerTheme("clair");
  // Échap ferme le panneau même si le focus n'est pas dedans (dedans, piegeFocus s'en charge).
  document.addEventListener("keydown", ev => { if (ev.key === "Escape" && Explorateur.estOuvert()) Explorateur.fermer(); });
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
