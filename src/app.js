"use strict";
/* ═══════════════════════════════════════════════════════════
   REQUÊT'R — lot 3 : éditeur SQL, comparateur de résultats, types d'exercices
   1. CONFIG     2. UI (el, icônes, toasts, tableau, éditeur, piège de focus)     3. (moteur : voir src/moteur.js)
   4. EXPLORATEUR DE SCHÉMA     5. EXERCICES ET BAC À SABLE     6. APP
   Globaux fournis par le build, avant ce fichier : initSqlJs (vendor), WASM_B64, SEED_SQL, CONTENU, CLAUSES, PALIERS (contenu.js),
   Moteur et nouvelleBase (moteur.js), Comparateur (comparateur.js), TYPES_EXERCICE, Indices, Attendus (exercices.js).
   ═══════════════════════════════════════════════════════════ */

/* ══ 1. CONFIG ══════════════════════════════════════════════ */
const CONFIG = {
  version: "0.3.0-lot3",
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
  exercices: '<rect x="3.5" y="3" width="13" height="14" rx="1.5"/><path d="M7 7.5h6M7 10.5h6M7 13.5h3.5"/>',
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

/** Table de résultats en lecture seule (à placer dans un conteneur .resultat).
 *  `absents` : indices des lignes à surligner (celles qui n'existent pas dans l'autre résultat, pour la comparaison). */
function tableResultat(jeu, limite, { absents = [] } = {}) {
  const marques = new Set(absents);
  const affichees = jeu.lignes.slice(0, limite);
  const corps = affichees.length
    ? affichees.map((l, i) => el("tr" + (marques.has(i) ? ".ecart" : ""), {}, l.map(v => { const f = formaterCellule(v); return el("td" + (f.classe ? "." + f.classe : ""), {}, f.texte); })))
    : [el("tr", {}, el("td.aucune", { colspan: jeu.colonnes.length }, "Aucune ligne."))];
  return el("div.resultat__zone", {},
    el("table", {},
      el("thead", {}, el("tr", {}, jeu.colonnes.map(c => el("th", { scope: "col" }, c)))),
      el("tbody", {}, corps)));
}

const milliers = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const nbLignes = n => `${n} ligne${n > 1 ? "s" : ""}`;

/** Éditeur SQL : un <textarea> à chasse fixe, sans coloration ni autocomplétion (lot 3, volontairement sobre).
 *  Ctrl/Cmd + Entrée exécute ; avec Maj, vérifie (si `surVerifier` est fourni). Tab reste le changement de focus (accessibilité).
 *  Le composant ne se reconstruit jamais : le verdict met à jour d'autres zones, jamais ce <textarea>. */
function editeurSQL({ valeur = "", etiquette = "Requête SQL", surExecuter, surVerifier = null, surChange = null }) {
  const zone = el("textarea.editeur-sql", { spellcheck: "false", autocomplete: "off", autocapitalize: "off", "aria-label": etiquette }, valeur);
  zone.addEventListener("keydown", ev => {
    if (ev.key !== "Enter" || !(ev.ctrlKey || ev.metaKey)) return;
    ev.preventDefault();
    if (ev.shiftKey && surVerifier) surVerifier(); else surExecuter();
  });
  zone.addEventListener("input", () => { if (surChange) surChange(zone.value); });
  return {
    element: zone,
    valeur: () => zone.value,
    definir(v) { zone.value = v; if (surChange) surChange(v); },
    focus: () => zone.focus()
  };
}

/** Ce que « Exécuter » affiche : un tableau par jeu de résultats, l'erreur SQLite BRUTE telle quelle (lire
 *  « near "SELEC": syntax error » fait partie du métier), et les remarques utiles (écriture, plafond, délai). */
function blocsExecution(res) {
  const blocs = [];
  res.jeux.forEach((jeu, i) => {
    const n = jeu.lignes.length;
    const total = jeu.tronque ? `Plus de ${milliers(res.limiteLecture)} lignes` : nbLignes(n);
    blocs.push(el("h3.resultat__titre", {}, (res.jeux.length > 1 ? `Résultat ${i + 1} — ` : "") + total));
    blocs.push(tableResultat(jeu, res.limite));
    if (n > res.limite) blocs.push(el("p.resultat__note", {}, `Affichage limité aux ${res.limite} premières lignes.`));
    if (jeu.tronque) blocs.push(el("p.resultat__note", {}, `Lecture arrêtée à ${milliers(res.limiteLecture)} lignes : la requête en renvoie davantage.`));
  });
  if (res.interrompu) blocs.push(el("p.resultat__note", {}, `Lecture interrompue au bout de ${res.delaiMs / 1000} s : la requête est trop longue.`));
  if (res.erreur) {
    blocs.push(el("div.erreur-sql", { role: "alert" }, el("b", {}, "Erreur SQLite"), el("pre", {}, res.erreur)));
  } else if (!res.instructions) {
    blocs.push(el("p.muet", { style: "margin-top:12px" }, "Rien à exécuter."));
  } else if (!res.jeux.length) {
    blocs.push(el("p.muet", { style: "margin-top:12px" }, "Exécuté sans erreur. Cette requête ne renvoie aucune ligne."));
  }
  if (res.ecritures) blocs.push(el("p.resultat__note", {}, "La base a été modifiée : « Réinitialiser la base » la remet à neuf. Vérifier travaille toujours sur la base d'origine."));
  return blocs;
}

/* ══ 3. MOTEUR SQL ══════════════════════════════════════════ */
/* Sorti de ce fichier au lot 3 : voir src/moteur.js (Moteur, nouvelleBase). */

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

/* ══ 5. EXERCICES ET BAC À SABLE ═════════════════════════════ */
/** Mémoire d'écran : brouillons et état de chaque exercice, EN MÉMOIRE seulement (jamais persistée : c'est le Store du lot 4).
 *  `tentatives` et `indices` sont exposés dans chaque retour ; la politique de comptage sera décidée avec Progression (lot 4). */
const Memoire = { exercices: new Map(), bac: null };
function etatExercice(ex) {
  if (!Memoire.exercices.has(ex.id)) Memoire.exercices.set(ex.id, { brouillon: null, tentatives: 0, indices: 0, reussi: false, dernier: null, reponse: null });
  return Memoire.exercices.get(ex.id);
}

const LIBELLE_TYPE = { qcm: "Question à choix", requete: "Écrire une requête", corriger: "Corriger une requête", predire: "Prédire le résultat" };
const TITRE_NON_EVALUE = {
  "vide": "Requête vide", "erreur-sql": "Erreur SQLite", "ecriture": "Écriture non évaluée", "aucun-jeu": "Rien à comparer",
  "interrompu": "Requête interrompue", "saisie-invalide": "Réponse illisible", "trop-volumineux": "Résultat trop volumineux"
};

/** Deux résultats côte à côte, tronqués aux premières lignes ; les lignes sans équivalent de l'autre côté sont surlignées.
 *  Un résultat attendu d'UNE cellule n'est jamais affiché (D034) : on ne dit que sa forme. */
const LIGNES_COMPARAISON = 8;
function comparaisonResultats(v, { ordreCompte = false } = {}) {
  const e = v.ecart;
  const titreObtenu = v.obtenu.tronque ? `plus de ${milliers(e.lignes.obtenues)} lignes` : nbLignes(e.lignes.obtenues);
  /** Quand l'ordre des lignes ne compte pas, les lignes sans équivalent passent en premier : l'écart se voit tout de suite,
   *  même s'il est à la 15e ligne d'un résultat tronqué à 8. Quand il compte, l'ordre d'origine est conservé. */
  const miseEnAvant = (jeu, absents) => {
    if (ordreCompte || !absents.length) return { jeu, absents };
    const marque = new Set(absents), premiers = [], autres = [];
    jeu.lignes.forEach((l, i) => (marque.has(i) ? premiers : autres).push(l));
    return { jeu: { colonnes: jeu.colonnes, lignes: [...premiers, ...autres], tronque: jeu.tronque }, absents: premiers.map((_, i) => i) };
  };
  const colonne = (titre, jeu, absents) => {
    const m = miseEnAvant(jeu, absents);
    return el("div.comparaison__col", {},
      el("h4", {}, titre),
      el("div.resultat", {}, tableResultat(m.jeu, LIGNES_COMPARAISON, { absents: m.absents }),
        jeu.lignes.length > LIGNES_COMPARAISON ? el("p.resultat__note", {}, `… ${jeu.lignes.length - LIGNES_COMPARAISON} lignes de plus.`) : null));
  };
  const gauche = colonne(`Votre résultat (${titreObtenu})`, v.obtenu, e.absentsObtenus || []);
  const droite = v.masque || !v.attendu
    ? el("div.comparaison__col", {}, el("h4", {}, `Résultat attendu (${nbLignes(e.lignes.attendues)}, ${e.colonnes.attendues} colonne${e.colonnes.attendues > 1 ? "s" : ""})`),
        el("p.comparaison__masque", {}, "La valeur attendue n'est pas affichée : elle reviendrait à donner la réponse. Le constat ci-dessus décrit l'écart."))
    : colonne(`Résultat attendu (${nbLignes(e.lignes.attendues)})`, v.attendu, e.absentsAttendus || []);
  const surligne = (e.absentsObtenus && e.absentsObtenus.length) || (e.absentsAttendus && e.absentsAttendus.length);
  return el("div", {}, el("div.comparaison", {}, gauche, droite),
    surligne ? el("p.resultat__note", {}, "Les lignes surlignées n'ont pas d'équivalent exact dans l'autre résultat"
      + (ordreCompte ? "." : " ; elles sont placées en premier, car l'ordre des lignes ne compte pas ici.")) : null);
}

/** La section « Écart » : jusqu'à 3 lignes attendues sans équivalent, jusqu'à 3 lignes obtenues sans équivalent. */
function blocEcart(v) {
  const e = v.ecart;
  if (v.masque || !v.attendu || !(e.nbManquantes || e.nbEnTrop)) return null;
  const partie = (titre, nb, jeu, lignes) => nb ? [
    el("h3.resultat__titre", {}, `${titre} (${nb}${nb > 3 ? ", 3 premières" : ""})`),
    el("div.resultat", {}, tableResultat({ colonnes: jeu.colonnes, lignes }, 3))] : null;
  return el("div.ecart-bloc", {}, el("b", {}, "Écart"),
    partie("Lignes attendues sans équivalent dans votre résultat", e.nbManquantes, v.attendu, e.manquantes),
    partie("Lignes de votre résultat sans équivalent dans l'attendu", e.nbEnTrop, v.obtenu, e.enTrop));
}

/** Le retour d'une réponse : constat (toujours vrai), où regarder (faits et lieux, jamais une hypothèse), comparaison, et — à la
 *  réussite — l'explication et « à retenir ». Le lot 4 le fondra dans le carteRetour porté de Classe'R. */
function carteVerdict(v, ex) {
  const juste = v.statut === "reussi", neutre = v.statut === "non-evalue";
  const termine = juste || ex.type === "qcm" || ex.type === "predire";      // ces types n'ont qu'une réponse : l'explication suit toujours
  const titre = juste ? ({ qcm: "Bonne réponse", predire: "Bien vu" }[ex.type] || "Résultat correct")
    : neutre ? (TITRE_NON_EVALUE[v.code] || "Pas évalué") : "Pas tout à fait";
  const corps = [];
  if (v.code === "erreur-sql") corps.push(el("div.erreur-sql", { role: "alert" }, el("b", {}, "Erreur SQLite"), el("pre", {}, v.constat)));
  else if (v.constat) corps.push(el("p.retour__constat", {}, v.constat));
  if (v.details) corps.push(el("p.retour__note", {}, `Écart observé : ${v.details}`));
  if (v.pistes && v.pistes.length) corps.push(el("div.retour__pistes", {}, el("b", {}, "Où regarder"), el("ul", {}, v.pistes.map(p => el("li", {}, p)))));
  (v.notes || []).forEach(n => corps.push(el("p.retour__note", {}, n.texte)));
  if (!juste && !neutre && v.ecart && v.obtenu && ex.type !== "qcm" && ex.type !== "predire") corps.push(comparaisonResultats(v, { ordreCompte: !!(ex.comparer && ex.comparer.ordonne) }), blocEcart(v));
  if (termine && ex.explication) corps.push(el("p", {}, ex.explication));
  if (termine && ex.retenir) corps.push(el("div.retour__usage", {}, el("b", {}, "À retenir"), ex.retenir));
  if (v.compte) corps.push(el("p.retour__note", {}, `Tentative ${v.tentatives}${v.indices ? ` · ${v.indices} indice${v.indices > 1 ? "s" : ""} vu${v.indices > 1 ? "s" : ""}` : ""}.`));
  return el("div.retour" + (juste ? ".retour--juste" : neutre ? ".retour--neutre" : ".retour--faux"), { role: "status" },
    el("div.retour__tete", {}, el("span.retour__icone", { "aria-hidden": "true" }, juste ? "✓" : neutre ? "i" : "✕"), el("span.retour__titre", {}, titre)),
    el("div.retour__corps", {}, corps));
}

/** Indices gradués : Piste → Clause → Exemple → Solution (verrouillée, révélée en dernier). */
function panneauIndices(ex, e) {
  const liste = Indices.pour(ex);
  if (!liste.length) return null;
  const panneau = el("div.indices");
  const bouton = el("button.btn.btn--nu.indices__btn", { type: "button" });
  const dessiner = () => {
    const restants = liste.length - e.indices, suivant = liste[e.indices];
    bouton.textContent = restants === 0 ? "Tout est affiché" : suivant.revele ? "Afficher la solution" : e.indices === 0 ? "Besoin d'un indice ?" : "Indice suivant";
    bouton.disabled = restants === 0;
    bouton.classList.toggle("indices__btn--solution", !!(suivant && suivant.revele));
    panneau.replaceChildren(bouton, ...liste.slice(0, e.indices).map(i =>
      el("div.indice" + (i.revele ? ".indice--solution" : ""), {}, el("b", {}, i.titre), i.revele && ex.type !== "qcm" ? el("pre", {}, i.texte) : el("div", {}, i.texte))));
  };
  bouton.addEventListener("click", () => { if (e.indices < liste.length) { e.indices++; dessiner(); } });
  dessiner();
  return panneau;
}

/** Puce d'action d'une carte d'exercice : le libellé dépend de ce que l'apprenant a déjà fait (Classe'R : carteAcces). */
function puceEtatExercice(e) {
  if (e.reussi) return el("span.puce.puce--ok", {}, "Refaire");
  if (e.tentatives > 0) return el("span.puce.puce--accent", {}, "Reprendre");
  return el("span.puce.puce--accent", {}, "Commencer");
}

/** Puce « difficulté » : des points pleins sur fond de points vides, 1 à 3. */
function puceDifficulte(n) {
  return el("span.puce", { "aria-label": `Difficulté ${n} sur 3` }, "●".repeat(n) + "○".repeat(3 - n));
}

function carteExercice(ex) {
  const e = etatExercice(ex);
  return el("button.carte.carte--action", { type: "button", onclick: () => { location.hash = `#/exercice/${ex.id}`; } },
    el("div.carte__entete", {}, el("h3.liste-exos__titre", {}, ex.titre), puceEtatExercice(e)),
    el("div.exo__meta", {},
      el("span.puce", {}, LIBELLE_TYPE[ex.type]),
      ex.niveau ? el("span.puce", {}, ex.niveau) : null,
      ex.competence ? el("span.puce", {}, ex.competence) : null,
      ex.difficulte ? puceDifficulte(ex.difficulte) : null),
    el("p.muet", { style: "font-size:13px" }, ex.question));
}

/** Place réservée, inerte : le lot 4 (Progression) la branchera. L'ossature est là ; rien ne se passe au clic. */
function carteRecommandeeInerte() {
  return el("button.carte.carte--action", { type: "button", disabled: true },
    el("div.carte__entete", {}, el("h3", {}, "Série recommandée"), el("span.puce", {}, "Bientôt")),
    el("p.muet", { style: "font-size:13px;margin-top:6px" },
      "Des exercices choisis selon votre progression. Arrive au lot 4, avec Progression."));
}

/** Sélecteur de palier, inerte lui aussi : la liste ci-dessous est déjà groupée par palier, mais rien ne filtre encore. */
function selecteurPalierInerte() {
  const segment = el("div.segment", { role: "group", "aria-label": "Filtrer par palier (bientôt disponible)" },
    el("button", { type: "button", disabled: true, "aria-pressed": "true" }, "Tous"),
    PALIERS.map(p => el("button", { type: "button", disabled: true, "aria-pressed": "false" }, p.titre)));
  return el("div", { style: "margin-bottom:var(--sp-4)" }, segment,
    el("p.tres-muet", { style: "font-size:12px;margin-top:6px" }, "Le filtre par palier arrive au lot 4, avec Progression."));
}

function pageExercices() {
  const exos = CONTENU.exercices;
  const parPalier = new Map();
  exos.forEach(ex => { const cle = ex.niveau || "?"; (parPalier.get(cle) || parPalier.set(cle, []).get(cle)).push(ex); });
  const sections = PALIERS
    .filter(p => parPalier.has(p.id))
    .map(p => el("div.section", {},
      el("div.section__titre", {}, el("h2", {}, `${p.id} — ${p.titre}`)),
      el("div.liste-exos", {}, parPalier.get(p.id).map(carteExercice))));
  return el("div.vue", {},
    el("header.entete", {},
      el("div.entete__sur", {}, "Lot 3 — exercices de démonstration"),
      el("h1", {}, "Exercices"),
      el("p", {}, "Quatre exercices jetables, un par type, pour éprouver la mécanique : poser, résoudre, corriger automatiquement, commenter. Le contenu pédagogique arrive à partir du lot 6.")),
    carteRecommandeeInerte(),
    selecteurPalierInerte(),
    sections);
}

function pageExercice(ex) {
  nouvelleBase();                                   // D008 : chaque exercice repart d'une base propre
  const e = etatExercice(ex);
  const type = TYPES_EXERCICE[ex.type];
  const rappels = [];
  const zoneRetour = el("div", { id: "zone-retour" });
  const pied = el("div.exo__pied");
  const suivant = CONTENU.exercices[CONTENU.exercices.findIndex(x => x.id === ex.id) + 1] || null;

  let erreurAuteur = null;                          // le résultat attendu est calculé à l'entrée et mis en cache ; une référence qui plante se voit tout de suite
  try { if (ex.type === "predire") Attendus.predire(ex); else if (ex.solution) Attendus.de(ex); } catch (err) { erreurAuteur = err.message; }

  let panneau = null;
  const majPied = () => {
    const boutonSuivant = e.dernier && e.dernier.statut !== "non-evalue" && (e.reussi || ex.type === "qcm" || ex.type === "predire") && suivant
      ? el("a.btn.btn--fort", { href: `#/exercice/${suivant.id}`, id: "exo-suivant" }, "Exercice suivant →") : null;
    pied.replaceChildren(el("a.btn", { href: "#/exercices" }, "← Tous les exercices"), ...(boutonSuivant ? [boutonSuivant] : []));
  };
  const afficherRetour = retour => {
    zoneRetour.replaceChildren(carteVerdict(retour, ex));
    if (retour.reussi && panneau) panneau.remove();
    majPied();
  };

  const api = {
    get brouillon() { return e.brouillon; },
    surBrouillon: v => { e.brouillon = v; },
    reponsePrecedente: e.reponse,
    surRetour: fn => rappels.push(fn),
    repondre(r) {
      const res = type.valider(ex, r);
      if (res.compte) { e.tentatives++; e.reponse = r; }
      if (res.reussi) e.reussi = true;
      const retour = { ...res, tentatives: e.tentatives, indices: e.indices };     // ce que Progression consommera au lot 4
      e.dernier = retour;
      rappels.forEach(fn => fn(retour));
      afficherRetour(retour);
      const aller = retour.reussi ? document.getElementById("exo-suivant") : null;   // à la réussite, le focus passe au bouton de suite
      if (aller) aller.focus(); else zoneRetour.scrollIntoView({ block: "nearest" });
      return retour;
    }
  };

  const bloc = erreurAuteur
    ? el("div.erreur-sql", { role: "alert" }, el("b", {}, "Exercice mal écrit"), el("pre", {}, erreurAuteur))
    : type.rendre(ex, api);
  if (!e.reussi) panneau = panneauIndices(ex, e);
  if (e.dernier) { rappels.forEach(fn => fn(e.dernier)); afficherRetour(e.dernier); }      // retour sur un exercice déjà tenté : on retrouve son verdict
  majPied();

  return el("div.vue", {},
    el("header.entete", {}, el("div.entete__sur", {}, "Exercice de démonstration"), el("h1", {}, ex.titre)),
    el("div.exo__meta", {}, el("span.puce", {}, LIBELLE_TYPE[ex.type]), el("span.puce", {}, "jetable (lot 3)")),
    el("div.exo__question", {}, ex.question),
    ex.consigne ? el("div.exo__consigne", {}, ex.consigne) : null,
    bloc, panneau, zoneRetour, pied);
}

/* Bac à sable : le même éditeur, sans exercice. Ctrl + Entrée exécute sur la base vivante. */
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

function pageBacASable() {
  const sortie = el("div.resultat", { "aria-live": "polite" });
  const etat = el("div.sql-etat", {});
  const puceTables = el("span.puce", {});
  const editeur = editeurSQL({
    valeur: Memoire.bac === null ? EXEMPLES.apercu : Memoire.bac, etiquette: "Requête SQL",
    surExecuter: () => lancer(), surChange: v => { Memoire.bac = v; }
  });

  function majEtat(extra) {
    puceTables.textContent = `${Moteur.nbTables()} table(s) en mémoire`;
    etat.replaceChildren(
      el("span", {}, `SQLite ${Moteur.etat.version}`),
      el("span", {}, `prêt en ${Moteur.etat.msInit} ms`),
      el("span", {}, `base reconstruite en ${Moteur.etat.msBase} ms`),
      puceTables,
      ...(extra ? [el("span", {}, extra)] : []));
  }
  function lancer() {
    const res = Moteur.executer(editeur.valeur());
    sortie.replaceChildren(...blocsExecution(res));
    majEtat(`${res.ms} ms`);
  }
  function exemple(cle) { editeur.definir(EXEMPLES[cle]); lancer(); editeur.focus(); }

  const page = el("div.vue", {},
    el("header.entete", {},
      el("div.entete__sur", {}, "Bac à sable"),
      el("h1", {}, "Bac à sable SQL"),
      el("p", {}, "Un vrai SQLite, dans ce seul fichier, sans réseau, avec la base d'une boutique en ligne. Ouvrez le « Schéma » (rail de navigation) pour voir ses tables et leurs relations, sans quitter cette page.")),
    el("section.carte", {},
      editeur.element,
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
        el("button.btn.btn--nu", { type: "button", onclick: () => basculerTheme() }, "Thème clair / sombre")),
      etat),
    sortie);
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

function coquille(contenu, actif = "") {
  const lien = (href, cle, nomIcone, libelle) =>
    el("a.rail__lien", { href, "aria-current": actif === cle ? "page" : null }, icone(nomIcone), el("span", {}, libelle));
  document.getElementById("app").replaceChildren(
    el("a.saut", { href: "#", onclick: ev => { ev.preventDefault(); document.getElementById("zone-contenu").focus(); } },
      "Aller au contenu"),
    el("aside.rail", {},
      el("div.rail__marque", {}, el("div.logo", {}, "R"), el("div.rail__nom", {}, "Requêt'R")),
      el("nav.rail__nav", { "aria-label": "Navigation principale" },
        lien("#/exercices", "exercices", "exercices", "Exercices"),
        lien("#/bac-a-sable", "bac", "bacasable", "Bac à sable"),
        el("div.rail__sep"),
        Explorateur.bouton()),
      el("div.rail__bas", {}, el("div.tres-muet", { style: "font-size:11.5px" }, "Apprendre le SQL en pratiquant"))),
    el("main.principal", {}, el("div.contenu", { id: "zone-contenu", tabindex: "-1" }, contenu))
  );
  Explorateur.majBouton();                       // le rail est reconstruit à chaque écran : le bouton retrouve son état (panneau ouvert ou non)
}

/** Navigation minimale par le fragment d'adresse (#/exercices, #/exercice/<id>, #/bac-a-sable). Provisoire : le Routeur de
 *  Classe'R, porté au lot 4, la remplacera. L'explorateur n'est PAS une route : c'est un voile par-dessus l'écran en cours,
 *  qui ne détruit jamais l'éditeur. */
const PREFIXE_EXERCICE = "#/exercice/";
function route(premiere = false) {
  const h = location.hash || "#/exercices";
  let page, actif = "exercices";
  try {
    if (h.startsWith(PREFIXE_EXERCICE)) {
      const ex = CONTENU.exercices.find(x => x.id === decodeURIComponent(h.slice(PREFIXE_EXERCICE.length)));
      page = ex ? pageExercice(ex) : pageExercices();
    } else if (h === "#/bac-a-sable") { page = pageBacASable(); actif = "bac"; }
    else page = pageExercices();
  } catch (err) {
    console.error(err);
    page = el("div.erreur-sql", { role: "alert" }, el("b", {}, "Cet écran n'a pas pu s'afficher"), el("pre", {}, String(err && err.message || err)));
  }
  coquille(page, actif);
  if (!premiere) { window.scrollTo(0, 0); document.getElementById("zone-contenu").focus({ preventScroll: true }); }
}

async function demarrer() {
  appliquerTheme("clair");
  // Échap ferme le panneau même si le focus n'est pas dedans (dedans, piegeFocus s'en charge).
  document.addEventListener("keydown", ev => { if (ev.key === "Escape" && Explorateur.estOuvert()) Explorateur.fermer(); });
  coquille(el("p.muet", {}, "Chargement de SQLite…"));
  try {
    await Moteur.initialiser();
    window.addEventListener("hashchange", () => route());
    route(true);
  } catch (err) {
    console.error(err);
    coquille(el("div.erreur-sql", { role: "alert" }, el("b", {}, "SQLite n'a pas pu démarrer"), el("pre", {}, String(err && err.message || err))));
  }
}

document.addEventListener("DOMContentLoaded", demarrer);
